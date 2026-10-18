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
| XGBoost | https://xgboost.readthedocs.io | installed in the base image, not used by the live service || PyArrow | https://arrow.apache.org/docs/python/ | parquet files |
| FastAPI | https://fastapi.tiangolo.com | API service |
| Uvicorn | https://www.uvicorn.org | API server |
| httpx | https://www.python-httpx.org | HTTP client (API container) |
| pydantic | https://docs.pydantic.dev | request validation in the API |
| PyCryptodome | https://www.pycryptodome.org | Ed25519 signatures for the audit log (cryptography has no wheel on s390x) |
| JupyterLab | https://jupyter.org | notebooks |
| Matplotlib | https://matplotlib.org | plots |

## Platform
- IBM LinuxONE Community Cloud (s390x, Ubuntu 24.04)
- Docker: https://www.docker.com
- - API image base: python:3.12-slim (Python 3.12), https://hub.docker.com/_/python
- Base image: registry.linuxone.cloud.marist.edu/l1cc/jupyterlab-image-s390x

Versions in the real-model service: FastAPI 0.143.3, uvicorn 0.54.0, httpx 0.28.1, pydantic 2.14.1, PyCryptodome 4.0.0, LightGBM 4.7.0, numpy 2.0.2, pandas 3.0.6.
