<div align="center">

# 🌍 Hack4IMPACT (Track 2) — Team P.cpp
**Repository:** [Hack4IMPACTTrack2-P.cpp](https://github.com/Prithanjan/Hack4IMPACTTrack2-P.cpp.git)

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg?style=for-the-badge&logo=python&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](#)
[![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C.svg?style=for-the-badge&logo=pytorch&logoColor=white)](#)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)

*Building high-impact, transparent Artificial Intelligence for real-world application.*

</div>

---

## 👥 The Engineering Team: P.cpp
We are a collective of developers focused on building systems that matter. 

| Name | Role | Roll Number | Institutional Email |
| :--- | :--- | :--- | :--- |
| **Prithanjan Acharyya** 👑 | **Team Lead** | $25051032$ | 25051032@kiit.ac.in |
| **Piyush Ranjan Jha** | Lead System Architect | $25051029$ | 25051029@kiit.ac.in |
| **Prarabdh Mishra** | ML Engineer (XAI) | $25051369$ | 25051369@kiit.ac.in |
| **Pramesh Srivastava** | Backend & Reporting | $25051368$ | 25051368@kiit.ac.in |

---

## 🎯 The IMPACT: Why We Built This
For **Track 2**, we focused on solving a critical bottleneck in the deployment of deep learning models in high-stakes environments (like healthcare): **The Black Box Problem.**

High-accuracy models exist, but they lack interpretability. A user cannot trust a prediction model outputting $P(\text{Target}) = 0.98$ without knowing *where* the model is looking. Our solution bridges the gap between raw algorithmic power and human trust by providing **Explainable AI (XAI)** as a service.

---

## 🧠 System Architecture & Mathematics

### 1. Deep Learning Backbone
We employ a state-of-the-art Convolutional Neural Network (CNN) backbone. The model processes a tensor $X \in \mathbb{R}^{H \times W \times C}$ to produce a classification probability:
$$\hat{y} = \sigma(\mathbf{W}^T \cdot \phi(X) + b)$$
Where $\phi(X)$ represents the high-dimensional feature vector extracted from the final global average pooling layer.

### 2. Explainable AI (Grad-CAM)
To solve the transparency issue, we implemented **Gradient-weighted Class Activation Mapping (Grad-CAM)**. The importance weights $\alpha_k^c$ for a given class $c$ are calculated using the partial derivatives of the output w.r.t the feature maps:
$$\alpha_k^c = \frac{1}{Z} \sum_i \sum_j \frac{\partial y^c}{\partial A_{ij}^k}$$
The final visualization heatmap is passed through a $ReLU$ activation to isolate positive clinical contributions:
$$L_{Grad-CAM}^c = \text{ReLU}\left(\sum_k \alpha_k^c A^k\right)$$

---

## 🚀 Key Features
* ⚡ **Sub-Second Inference:** Optimized for rapid triage and high-pressure environments.
* 🗺️ **Visual Localization:** Dynamic heatmaps overlay over the original input to prove the AI's "thought process."
* 📊 **Confidence Analytics:** Multi-class probability distributions rendered via clean UI charts.
* 📄 **Automated PDF Reporting:** Instantly compiles the raw image, Grad-CAM heatmap, confidence scores, and user notes into a downloadable, professional report.

---

## 🛠️ Tech Stack Integration
* **Frontend:** `React 19`, `Tailwind CSS 4`, `Recharts` (for probability visualization), `jsPDF` (for report generation).
* **Backend:** `Python 3.11`, `Flask`, `CORS`.
* **Machine Learning:** `PyTorch`, `Torchvision` (ResNet50/DenseNet), `pytorch-grad-cam`, `OpenCV` (for tensor-to-image heatmap overlays).

---

## ⚙️ Quick Start (Run Locally)

### 1. Clone the Repository
```bash
git clone https://github.com/Prithanjan/Hack4IMPACTTrack2-P.cpp.git
cd Hack4IMPACTTrack2-P.cpp
```

### 2. Run the Backend (Flask API)
```bash
cd backend
pip install -r requirements.txt
py app.py
```
> ✅ API server starts at **http://localhost:5000**

### 3. Run the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
> ✅ App starts at **http://localhost:5173**

### 4. Open the App
Navigate to `http://localhost:5173` in your browser. Create an account, then head to **AI Analysis** to upload a chest X-ray or use one of the 6 pre-loaded demo samples.

---

## 🔒 Privacy & Compliance
All uploaded images are processed **in-memory only** and discarded immediately after inference. No patient data is persisted to any database. The system is designed with a HIPAA-compliant architecture by default.

---

<div align="center">
<sub>© 2026 Team P.cpp · KIIT University · Built for Hack4IMPACT Track 2</sub>
</div>
