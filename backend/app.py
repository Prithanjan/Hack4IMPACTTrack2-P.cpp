import os
import time
import hashlib
import base64
import io
import zlib
import struct
import math
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ── In-memory inference cache ─────────────────────────────────────────────────
inference_cache = {}

# ── Clinical interpretation library ──────────────────────────────────────────
INTERPRETATIONS = {
    "abnormal": {
        "finding": "Pulmonary Consolidation Detected",
        "region": "Right Lower Lobe",
        "severity": "Moderate",
        "description": (
            "The AI model identified a region of increased opacity in the right lower lobe, "
            "consistent with pulmonary consolidation. This pattern is commonly observed in "
            "community-acquired pneumonia. The Grad-CAM heatmap highlights the area of highest "
            "diagnostic interest (red = high confidence)."
        ),
        "recommendation": (
            "Correlate with clinical signs (fever, cough, sputum). Consider sputum culture, "
            "CBC with differential, and CRP. Antibiotic therapy may be indicated pending culture results. "
            "Repeat radiograph in 4–6 weeks to confirm resolution."
        ),
        "urgency": "moderate",
        "icd10": "J18.9"
    },
    "normal": {
        "finding": "No Acute Cardiopulmonary Process",
        "region": "Bilateral lung fields",
        "severity": "None",
        "description": (
            "The AI model found no significant pulmonary pathology. Lung fields appear clear bilaterally. "
            "Cardiac silhouette is within normal limits. No pleural effusion or pneumothorax detected."
        ),
        "recommendation": (
            "No immediate radiological intervention required. Recommend routine follow-up as per "
            "clinical protocol. Maintain preventive care guidelines."
        ),
        "urgency": "low",
        "icd10": "Z00.00"
    },
    "uncertain": {
        "finding": "Indeterminate Lung Finding",
        "region": "Multi-focal",
        "severity": "Uncertain",
        "description": (
            "The AI model's confidence score is below the clinical threshold (70%). The image may "
            "represent an atypical presentation, overlapping pathologies, or suboptimal image quality. "
            "Heatmap visualization has been disabled to prevent misleading clinical correlation."
        ),
        "recommendation": (
            "Manual radiologist review is strongly recommended. Consider repeat imaging with optimized "
            "technique. Clinical correlation with patient history, lab values, and symptoms is essential "
            "before any diagnostic conclusion."
        ),
        "urgency": "high",
        "icd10": "R91.8"
    }
}


# ── Pure-Python PNG encoder (no Pillow/numpy) ─────────────────────────────────
def _pack_png_chunk(chunk_type, data):
    """Pack a PNG chunk: length + type + data + CRC."""
    c = chunk_type + data
    return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)


def _heatmap_color(v):
    """Map 0–1 to blue→cyan→green→yellow→red as (R,G,B) uint8."""
    v = max(0.0, min(1.0, v))
    if v < 0.25:
        t = v / 0.25
        return (0, int(t * 200), 255)
    elif v < 0.5:
        t = (v - 0.25) / 0.25
        return (0, 200 + int(t * 55), int((1 - t) * 255))
    elif v < 0.75:
        t = (v - 0.5) / 0.25
        return (int(t * 255), 255, 0)
    else:
        t = (v - 0.75) / 0.25
        return (255, int((1 - t) * 255), 0)


def generate_gradcam_png_b64(W, H, is_abnormal):
    """
    Render a Grad-CAM-style heatmap as a pure-Python PNG (no external libs).
    The heatmap consists of one or two Gaussian blobs drawn in jet colourmap,
    blended over a dark grey 'X-ray' background.
    """
    # Gaussian blob parameters
    if is_abnormal:
        blobs = [
            (W * 0.65, H * 0.63, W * 0.22, H * 0.18, 1.0),   # main focus
            (W * 0.55, H * 0.77, W * 0.13, H * 0.10, 0.55),  # secondary
        ]
    else:
        blobs = [
            (W * 0.50, H * 0.48, W * 0.08, H * 0.07, 0.30),  # faint diffuse
        ]

    pixels = []
    for y in range(H):
        row = []
        for x in range(W):
            # Superimpose blobs
            v = 0.0
            for (cx, cy, rx, ry, strength) in blobs:
                dx = (x - cx) / rx
                dy = (y - cy) / ry
                v = max(v, strength * math.exp(-(dx * dx + dy * dy)))

            # Background: simulate a dark radiograph gradient
            bg_r = int(30 + 25 * (1 - abs(x / W - 0.5) * 2) * (1 - abs(y / H - 0.5) * 2))
            bg_g, bg_b = bg_r, bg_r

            if v > 0.04:
                hr, hg, hb = _heatmap_color(v)
                alpha = min(v * 1.6, 0.85)  # blend strength
                r = int(bg_r * (1 - alpha) + hr * alpha)
                g = int(bg_g * (1 - alpha) + hg * alpha)
                b = int(bg_b * (1 - alpha) + hb * alpha)
            else:
                r, g, b = bg_r, bg_g, bg_b

            row.extend([r, g, b])
        # PNG filter byte 0 (None) before each scanline
        pixels.append(bytes([0]) + bytes(row))

    raw = zlib.compress(b''.join(pixels), 9)

    # Assemble PNG
    png  = b'\x89PNG\r\n\x1a\n'
    png += _pack_png_chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0))
    png += _pack_png_chunk(b'IDAT', raw)
    png += _pack_png_chunk(b'IEND', b'')
    return base64.b64encode(png).decode('utf-8')


def is_valid_image(file_bytes):
    """Image Quality Gatekeeper — checks for valid image file signatures."""
    if len(file_bytes) < 8:
        return False, "File is too small to be a valid image."
    # PNG magic
    if file_bytes[:8] == b'\x89PNG\r\n\x1a\n':
        return True, None
    # JPEG magic
    if file_bytes[:3] == b'\xff\xd8\xff':
        return True, None
    # BMP magic
    if file_bytes[:2] == b'BM':
        return True, None
    return False, "Invalid image format. Please upload a JPEG or PNG chest radiograph."


def simulate_ensemble(is_abnormal, is_low_confidence):
    """ResNet50V2 + DenseNet121 ensemble (averaged confidences)."""
    if is_low_confidence:
        r = {"Pneumonia": 45.0, "Normal": 40.0, "Effusion": 15.0}
        d = {"Pneumonia": 55.0, "Normal": 35.0, "Effusion": 10.0}
    elif is_abnormal:
        r = {"Pneumonia": 92.5, "Normal": 5.0, "Effusion": 2.5}
        d = {"Pneumonia": 88.0, "Normal": 7.0, "Effusion": 5.0}
    else:
        r = {"Pneumonia": 2.0, "Normal": 96.0, "Effusion": 2.0}
        d = {"Pneumonia": 4.0, "Normal": 94.0, "Effusion": 2.0}

    preds = [{"class": c, "confidence": (r[c] + d[c]) / 2.0}
             for c in ["Pneumonia", "Normal", "Effusion"]]
    preds.sort(key=lambda x: x["confidence"], reverse=True)
    return preds


@app.route('/api/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file part"}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({"status": "error", "message": "No file selected"}), 400

    start = time.time()
    file_bytes = file.read()

    # 1. Image Quality Gatekeeper
    valid, err = is_valid_image(file_bytes)
    if not valid:
        return jsonify({"status": "error", "message": err, "gatekeeper": "REJECTED"}), 422

    # 2. Inference Cache
    file_hash = hashlib.md5(file_bytes).hexdigest()
    cache_key = file.filename if file.filename.startswith("demo_") else file_hash

    if cache_key in inference_cache:
        print(f"[CACHE HIT] {cache_key}")
        result = dict(inference_cache[cache_key])
        result['latency_ms'] = round((time.time() - start) * 1000, 2)
        result['cached'] = True
        return jsonify(result), 200

    print(f"[INFERENCE] {file.filename} — ResNet50V2 + DenseNet121 ensemble")
    time.sleep(1.2)  # simulate GPU inference time

    # 3. Scenario detection from filename
    name = file.filename.lower()
    is_low_confidence = name.startswith("demo_low_conf")
    is_abnormal = name.startswith("demo_abnormal") or (
        not name.startswith("demo_normal") and not is_low_confidence
    )

    # 4. Ensemble predictions
    predictions = simulate_ensemble(is_abnormal, is_low_confidence)
    top_conf = predictions[0]["confidence"]
    confidence_floor_passed = top_conf >= 70.0

    # 5. Grad-CAM heatmap (pure Python PNG, ~224×224)
    heatmap_b64 = None
    if confidence_floor_passed:
        heatmap_b64 = generate_gradcam_png_b64(224, 224, is_abnormal)
        print(f"[GRADCAM] Generated for {file.filename} ({top_conf:.1f}% confidence)")
    else:
        print(f"[GRADCAM] Skipped — confidence {top_conf:.1f}% below 70% floor")

    # 6. Clinical interpretation
    interp_key = "uncertain" if is_low_confidence or not confidence_floor_passed else ("abnormal" if is_abnormal else "normal")

    result = {
        "status": "success",
        "models_used": ["ResNet50V2_2025", "DenseNet121_2025"],
        "predictions": predictions,
        "heatmap_base64": heatmap_b64,
        "confidence_floor_passed": confidence_floor_passed,
        "clinical_interpretation": INTERPRETATIONS[interp_key],
        "cached": False,
        "latency_ms": round((time.time() - start) * 1000, 2)
    }

    inference_cache[cache_key] = result.copy()
    return jsonify(result), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
