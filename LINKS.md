# Datasets, libraries and references

## Dataset
- IBM Transactions for Anti Money Laundering (AML), Kaggle: https://www.kaggle.com/datasets/ealtman2019/ibm-transactions-for-anti-money-laundering-aml
  - Variants used: HI-Small, LI-Small only
  - License: CDLA-Sharing-1.0 (Community Data License Agreement, Sharing), per IBM's AML-Data repository
  - Synthetic data; contains no real customers.
- Paper: Altman et al., "Realistic Synthetic Financial Transactions for Anti-Money Laundering Models", NeurIPS 2023: https://arxiv.org/abs/2306.16424

## Libraries
| Library | Link | License | Used for |
|---|---|---|---|
| pandas | https://pandas.pydata.org | BSD-3-Clause | data handling |
| NumPy | https://numpy.org | BSD-3-Clause | arrays |
| SciPy | https://scipy.org | BSD-3-Clause | Clopper-Pearson bound |
| scikit-learn | https://scikit-learn.org | BSD-3-Clause | isotonic calibration, metrics |
| LightGBM | https://github.com/microsoft/LightGBM | MIT | model |
| XGBoost | https://xgboost.readthedocs.io | Apache-2.0 | installed in the base image, not used by the live service |
| PyArrow | https://arrow.apache.org/docs/python/ | Apache-2.0 | parquet files |
| FastAPI | https://fastapi.tiangolo.com | MIT | API service |
| Uvicorn | https://www.uvicorn.org | BSD-3-Clause | API server |
| httpx | https://www.python-httpx.org | BSD-3-Clause | HTTP client (API container) |
| pydantic | https://docs.pydantic.dev | MIT | request validation in the API |
| PyCryptodome | https://www.pycryptodome.org | BSD-2-Clause (some parts public domain) | Ed25519 signatures for the audit log (cryptography has no wheel on s390x) |
| JupyterLab | https://jupyter.org | BSD-3-Clause | notebooks |
| Matplotlib | https://matplotlib.org | Matplotlib License (PSF-based) | plots |

## Platform
- IBM LinuxONE Community Cloud (s390x, Ubuntu 24.04)
- Docker: https://www.docker.com (Docker Engine: Apache-2.0)
- API image base: python:3.12-slim (Python 3.12), https://hub.docker.com/_/python (Python: PSF License)
- Base image: registry.linuxone.cloud.marist.edu/l1cc/jupyterlab-image-s390x (license: ask Ashmitha)

Versions in the real-model service: FastAPI 0.143.3, uvicorn 0.54.0, httpx 0.28.1, pydantic 2.14.1, PyCryptodome 4.0.0, LightGBM 4.7.0, numpy 2.0.2, pandas 3.0.6.
