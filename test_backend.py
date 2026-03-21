import requests
import io
from PIL import Image
import numpy as np

BASE_URL = "http://localhost:5000"

def create_test_image():
    """Create a simple test chest X-ray image"""
    # Create a grayscale chest X-ray-like image
    img_array = np.random.randint(100, 180, (224, 224), dtype=np.uint8)
    # Add some structure to make it more realistic
    img_array[50:150, 60:170] = np.random.randint(120, 160, (100, 110), dtype=np.uint8)
    img = Image.fromarray(img_array, mode='L').convert('RGB')
    return img

def test_predict():
    """Test the /api/predict endpoint"""
    print("=" * 60)
    print("Testing Backend /api/predict Endpoint")
    print("=" * 60)
    
    # Create test image
    test_img = create_test_image()
    print("✓ Created test X-ray image (224x224)")
    
    # Save to bytes
    img_bytes = io.BytesIO()
    test_img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    # Send to backend
    print("\n📤 Sending image to http://localhost:5000/api/predict...")
    try:
        files = {'image': ('test_xray.png', img_bytes, 'image/png')}
        data = {'patient_id': 'TEST001', 'patient_name': 'Test Patient'}
        
        response = requests.post(f"{BASE_URL}/api/predict", 
                                files=files, 
                                data=data,
                                timeout=10)
        
        print(f"✓ Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n📊 Prediction Results:")
            print("-" * 60)
            print(f"  Diagnosis: {result.get('diagnosis', 'N/A')}")
            print(f"  Confidence: {result.get('confidence', 'N/A')}%")
            print(f"  Clinical Notes: {result.get('clinical_notes', 'N/A')}")
            
            if 'heatmap' in result:
                heatmap_len = len(result['heatmap'])
                print(f"  Heatmap: Generated successfully ({heatmap_len} bytes)")
            
            print("\n✅ BACKEND TEST PASSED - No crashes!")
            print("=" * 60)
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Backend not running on port 5000")
        print("Make sure to run: cd backend && python app.py")
        return False
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        return False

if __name__ == "__main__":
    test_predict()
