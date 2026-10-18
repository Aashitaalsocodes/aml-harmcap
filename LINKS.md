# Datasets, libraries and references

## Dataset
- IBM Transactions for Anti Money Laundering (AML), Kaggle: https://www.kaggle.com/datasets/ealtman2019/ibm-transactions-for-anti-money-laundering-aml
  - Variants used: HI-Small, LI-Small only
  - License: CHECK on the Kaggle page
  - Synthetic data; contains no real customers.
- Paper: Altman et al., "Realistic Synthetic Financial Transactions for Anti-Money Laundering Models", NeurIPS 2023: https://arxiv.org/abs/2306.16424

## Libraries
| Library | Link | Used for |
|---|---|---|
| pandas | https://pandas.pydata.org | data handling |
| NumPy | https://numpy.org | arrays |
| SciPy | https://scipy.org | Clopper-Pearson bound |
| scikit-learn | https://scikit-learn.org | isotonic calibration, metrics |
| LightGBM | https://github.com/microsoft/LightGBM | model |
| XGBoost | https://xgboost.readthedocs.io | installed in the base image |
| PyArrow | https://arrow.apache.org/docs/python/ | parquet files |
| FastAPI | https://fastapi.tiangolo.com | API service |
| Uvicorn | https://www.uvicorn.org | API server |
| httpx | https://www.python-httpx.org | HTTP client (API container) |
| PyCryptodome | https://www.pycryptodome.org | installed in the API container (confirm its use with Ashmitha) |
| cryptography | https://cryptography.io | Ed25519 signatures |
| JupyterLab | https://jupyter.org | notebooks |
| Matplotlib | https://matplotlib.org | plots |

## Platform
- IBM LinuxONE Community Cloud (s390x, Ubuntu 24.04)
- Docker: https://www.docker.com
- - API image base: python:3.12-slim (Python 3.12), https://hub.docker.com/_/python
- Base image: registry.linuxone.cloud.marist.edu/l1cc/jupyterlab-image-s390x
