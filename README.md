# CineVault --- Cloud-Native Movie Discovery Platform

```{=html}
<p align="center">
```
`<strong>`{=html}A movie discovery application demonstrating
containerization, CI, AWS deployment, observability, performance
testing, and Kubernetes autoscaling.`</strong>`{=html}
```{=html}
</p>
```
```{=html}
<p align="center">
```
`<img alt="Node.js" src="https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white">`{=html}
`<img alt="React" src="https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black">`{=html}
`<img alt="Docker" src="https://img.shields.io/badge/Docker-Containers-2496ED?logo=docker&logoColor=white">`{=html}
`<img alt="Kubernetes" src="https://img.shields.io/badge/Kubernetes-Orchestration-326CE5?logo=kubernetes&logoColor=white">`{=html}
`<img alt="AWS" src="https://img.shields.io/badge/Cloud-AWS-232F3E?logo=amazonaws&logoColor=white">`{=html}
`<img alt="Jenkins" src="https://img.shields.io/badge/CI-Jenkins-D24939?logo=jenkins&logoColor=white">`{=html}
`<img alt="Prometheus" src="https://img.shields.io/badge/Monitoring-Prometheus-E6522C?logo=prometheus&logoColor=white">`{=html}
`<img alt="Grafana" src="https://img.shields.io/badge/Dashboards-Grafana-F46800?logo=grafana&logoColor=white">`{=html}
```{=html}
</p>
```

------------------------------------------------------------------------

## 1. Project overview

**CineVault** is a cloud-native movie discovery platform built to
demonstrate an end-to-end DevOps workflow. It uses a React frontend and
a Node.js/Express backend. The services are containerized with Docker,
tested with Jest and Supertest, built through Jenkins, and deployed to
Amazon EKS using images stored in Amazon ECR.

The project also includes Prometheus application metrics, Grafana
dashboards, k6 performance tests, and Kubernetes Horizontal Pod
Autoscaling (HPA).

> **CI/CD scope clarification:** The verified Jenkins pipeline performs
> source checkout, environment validation, backend tests, and
> frontend/backend Docker image builds. The AWS EKS deployment was
> configured and verified separately. This README does not claim that
> Jenkins automatically deploys to EKS.

## 2. Architecture

![CineVault cloud-native architecture](docs/architecture.svg)

The architecture diagram represents the application and its
delivery/operations components. Local development uses Docker Compose
and DynamoDB Local. The cloud deployment uses Amazon EKS, Amazon ECR,
and Amazon DynamoDB.

### Jenkins CI workflow

![CineVault Jenkins CI workflow](docs/ci-workflow.svg)

## 3. Technology stack

  -----------------------------------------------------------------------
  Area                    Technologies            Purpose
  ----------------------- ----------------------- -----------------------
  Frontend                React, JavaScript,      Movie discovery UI and
                          Nginx                   static web serving

  Backend                 Node.js, Express.js     REST API and
                                                  application logic

  Data                    Amazon DynamoDB,        Cloud persistence and
                          DynamoDB Local          local development

  Movie data              TMDB API                External movie
                                                  catalogue data

  Containers              Docker, Docker Compose  Container images and
                                                  local multi-service
                                                  environment

  CI                      Jenkins, GitHub         Checkout, environment
                                                  checks, tests, and
                                                  image builds

  Testing                 Jest, Supertest         Backend and API tests

  Code quality            SonarQube               Static analysis and
                                                  code-quality review

  Image security          Trivy                   Container image
                                                  vulnerability scanning

  Registry                Amazon ECR              Container image storage

  Cloud                   Amazon EKS, Kubernetes  Managed Kubernetes
                                                  deployment

  Identity                EKS Pod Identity, IAM   Backend access to AWS
                                                  resources

  Metrics                 Prometheus, prom-client Application and runtime
                                                  metrics

  Dashboards              Grafana                 Observability
                                                  dashboards

  Load testing            Grafana k6              Smoke and staged load
                                                  tests

  Autoscaling             Metrics Server,         CPU metrics and
                          Kubernetes HPA          automatic pod scaling
  -----------------------------------------------------------------------

## 4. Implemented capabilities

### Application and containers

-   React frontend served through Nginx.
-   Node.js/Express backend with application APIs and a health endpoint.
-   Separate Dockerfiles for frontend and backend.
-   Docker Compose environment for the application, DynamoDB Local,
    Jenkins, Prometheus, and Grafana.
-   Backend metrics endpoint at `/metrics`.

### Automated testing and Jenkins

-   Jest and Supertest backend test suite.
-   **70 automated tests passed** in the verified Jenkins build.
-   Approximately **83.9% line coverage** in that verified build.
-   Jenkins stages: Git checkout, environment validation, dependency
    installation and tests, backend Docker image build, frontend Docker
    image build.
-   SonarQube analysis and Trivy image scans were also performed during
    project validation. Keep the actual scan evidence with the report.

### AWS deployment

-   Backend and frontend images stored in Amazon ECR.
-   Application deployed to Amazon EKS.
-   Backend exposed internally using a Kubernetes `ClusterIP` Service on
    port `5000`.
-   Frontend exposed through a Kubernetes `NodePort` Service on port
    `30080`.
-   Backend uses IAM through EKS Pod Identity to access DynamoDB.
-   Kubernetes Secrets supply sensitive application configuration.

### Prometheus and Grafana

-   Backend instrumentation uses `prom-client`.
-   Prometheus scrapes the backend `/metrics` endpoint every 15 seconds.
-   Grafana dashboard: **CineVault Observability Dashboard**.
-   Dashboard panels include CPU usage, resident memory, HTTP request
    rate, P95 response duration, total HTTP requests, and backend
    availability.

### k6 performance tests

These are observed results from the recorded test runs, not a
production-capacity guarantee.

  -----------------------------------------------------------------------
  Test                    Configuration           Observed result
  ----------------------- ----------------------- -----------------------
  Smoke test              1 VU, 10 seconds,       10 requests; 20/20
                          `/health`               checks passed; 0%
                                                  failed requests; P95
                                                  55.46 ms

  Staged load test        Up to 20 VUs over 2     1,325 requests;
                          minutes, `/health`      2,650/2,650 checks
                                                  passed; 0% failed;
                                                  average 12.42 ms; P95
                                                  48.2 ms; max 184.94 ms
  -----------------------------------------------------------------------

**Test scope:** Both recorded k6 scripts target `/health`. They validate
health-endpoint responsiveness under the tested load; they do not
establish performance for movie search, authentication, watchlist, or
database-heavy operations.

### Kubernetes HPA

-   Kubernetes Metrics Server installed and verified.
-   CPU-based HPA configured for `cinevault-backend`.
-   CPU target: **70% of the pod CPU request**.
-   Minimum replicas: **1**; maximum replicas: **3**.
-   Under the controlled load-generator test, CPU utilization reached
    **228%** of the CPU request and HPA scaled backend replicas from **1
    to 3**.
-   After the load stopped and CPU returned to approximately **1%**, HPA
    automatically scaled back to **1 replica**.
-   Final verification showed backend and frontend pods `Running`,
    deployments `1/1` available, and the EKS worker node `Ready`.

## 5. Repository structure

``` text
CineVaultProject/
├── backend/
│   ├── config/
│   │   └── metrics.js
│   ├── middleware/
│   │   └── metricsMiddleware.js
│   ├── Dockerfile
│   ├── app.js
│   ├── package.json
│   └── ...
├── frontend/
│   ├── Dockerfile
│   └── ...
├── infrastructure/
│   └── ...
├── jenkins/
│   └── Jenkinsfile
├── kubernetes/
│   └── ...
├── load-testing/
│   ├── smoke-test.js
│   └── load-test.js
├── monitoring/
│   └── prometheus/
│       └── prometheus.yml
├── security/
│   └── ...
├── docs/
│   ├── architecture.svg
│   └── ci-workflow.svg
├── docker-compose.yml
└── README.md
```

This is a high-level tree. Retain any additional files and folders
present in the actual repository.

## 6. Local development

### Prerequisites

-   Git
-   Node.js and npm (developed locally with Node.js 24 and npm 11)
-   Docker Desktop with Docker Compose
-   TMDB API access token
-   Required application environment variables

### Clone the repository

``` bash
git clone https://github.com/Pverma-1234/CineVault-Cloud-Native.git
cd CineVaultProject
```

If Git creates a directory with a different name, enter that directory
instead.

### Configure environment

Create the backend environment file expected by the application and
populate it locally. **Never commit `.env` files or real secrets.**

Configuration used by the deployment includes: - `PORT` - `AWS_REGION` -
`TMDB_ACCESS_TOKEN` - `JWT_SECRET` - `DYNAMODB_ENDPOINT` (for local
DynamoDB development)

Use an appropriate AWS identity mechanism for local AWS access. In EKS,
use the configured IAM role through EKS Pod Identity instead of
embedding long-lived AWS keys in an image.

### Start the local stack

``` bash
docker compose up -d --build
docker compose ps
```

Typical local endpoints from the configured Compose environment:

  Service           URL
  ----------------- -------------------------------
  Frontend          http://localhost:8080
  Backend health    http://localhost:5000/health
  Backend metrics   http://localhost:5000/metrics
  Prometheus        http://localhost:9090
  Grafana           http://localhost:3000
  DynamoDB Local    http://localhost:8000
  Jenkins           http://localhost:8081

Ports may differ if the Compose configuration is changed.

### Run backend tests

``` bash
cd backend
npm ci
npm test -- --coverage
cd ..
```

## 7. Monitoring

### Prometheus

The scrape configuration is in `monitoring/prometheus/prometheus.yml`.
Within the Compose network, Prometheus targets the backend service by
its Docker DNS name:

``` yaml
scrape_configs:
  - job_name: "cinevault-backend"
    metrics_path: "/metrics"
    static_configs:
      - targets: ["backend:5000"]
```

Open `http://localhost:9090` and verify that the `cinevault-backend`
target is **UP**.

### Grafana

Open `http://localhost:3000`. Configure Prometheus as a data source
using the Compose-network URL `http://prometheus:9090`, then open
**CineVault Observability Dashboard**.

Do not commit default credentials or real dashboard passwords. Change
defaults and use secure credentials outside disposable local
environments.

## 8. k6 performance tests

The scripts are stored in `load-testing/`.

Run the smoke test from the repository root:

``` bash
docker run --rm -v "${PWD}/load-testing:/scripts" grafana/k6 run /scripts/smoke-test.js
```

Run the staged load test:

``` bash
docker run --rm -v "${PWD}/load-testing:/scripts" grafana/k6 run /scripts/load-test.js
```

The scripts use `host.docker.internal` to reach the local backend from
the k6 container. Start and verify the backend before running a test.
Avoid aggressive tests against shared or production infrastructure.

## 9. AWS and Kubernetes verification

The project was deployed to Amazon EKS in `ap-south-1`. Resource names,
account IDs, and image tags are environment-specific. Use your own AWS
account, cluster, ECR repositories, IAM roles, and tags when reproducing
the deployment.

Useful commands:

``` bash
kubectl get nodes
kubectl get deployments -n cinevault
kubectl get services -n cinevault
kubectl get pods -n cinevault -o wide
kubectl get hpa -n cinevault
kubectl top nodes
kubectl top pods -n cinevault
```

The backend HPA was created with:

``` bash
kubectl autoscale deployment cinevault-backend \
  --cpu-percent=70 \
  --min=1 \
  --max=3 \
  -n cinevault
```

Newer Kubernetes versions may mark `--cpu-percent` as deprecated. The
equivalent current form is:

``` bash
kubectl autoscale deployment cinevault-backend \
  --cpu=70% \
  --min=1 \
  --max=3 \
  -n cinevault
```

Inspect an existing HPA before creating another:

``` bash
kubectl describe hpa cinevault-backend -n cinevault
```

## 10. Screenshots and report evidence

Add genuine screenshots captured from your environment. Suggested
structure:

``` text
docs/
└── screenshots/
    ├── jenkins-success.png
    ├── prometheus-target-up.png
    ├── grafana-dashboard.png
    ├── k6-smoke-test.png
    ├── k6-load-test.png
    ├── hpa-scale-up.png
    ├── hpa-three-backend-pods.png
    └── hpa-scale-down.png
```

Suggested captions:

1.  **Jenkins:** Successful Jenkins CI pipeline showing source checkout,
    environment validation, automated backend tests, and
    frontend/backend Docker image builds.
2.  **Prometheus:** Prometheus successfully scraping the CineVault
    backend metrics endpoint.
3.  **Grafana:** CineVault dashboard displaying backend CPU, memory,
    HTTP request rate, P95 latency, total requests, and service
    availability.
4.  **k6 smoke test:** Backend health-endpoint smoke test with all
    checks passing and zero failed HTTP requests.
5.  **k6 load test:** Controlled test with up to 20 virtual users, 1,325
    requests, zero failed requests, and a P95 response time of 48.2 ms.
6.  **HPA scale-up:** Backend replicas automatically increasing from one
    to three after CPU utilization exceeded the configured 70% target.
7.  **HPA pods:** Three healthy backend pods running on the EKS worker
    node after scale-up.
8.  **HPA scale-down:** Backend replicas automatically returning to one
    after the load was removed.

Do not use fabricated terminal screenshots as execution evidence. The
SVG diagrams in this README are architecture illustrations; use actual
captured screenshots to prove live execution.

## 11. Security and operational considerations

-   Never commit `.env` files, API tokens, JWT secrets, AWS credentials,
    kubeconfig files, or private keys.
-   Store sensitive values in an approved secret store or Kubernetes
    Secrets, and restrict access with IAM and Kubernetes RBAC.
-   Use EKS Pod Identity for workload access to AWS services where
    configured.
-   Review Trivy and SonarQube findings before production use. A
    successful build alone does not prove that an image or application
    is vulnerability-free.
-   The verified frontend Service is a `NodePort`; the project
    deployment described here does not claim an Application Load
    Balancer.
-   The demonstrated HPA scales backend pods using CPU utilization. It
    does not add worker nodes; cluster capacity is bounded by the
    configured node group.
-   The recorded k6 tests target `/health`, not every business endpoint.
-   AWS resources can incur charges even when application traffic is
    low. Stop or remove billable resources when they are no longer
    needed, after preserving required evidence and data.

## 12. Implementation status

  -----------------------------------------------------------------------
  Area                                Verified status
  ----------------------------------- -----------------------------------
  Application containers              Implemented

  Backend automated tests             70 tests passed in the verified
                                      Jenkins run

  Jenkins CI                          Checkout, environment checks,
                                      tests, and Docker image builds
                                      passed

  SonarQube / Trivy                   Analysis and image scanning
                                      performed

  Amazon ECR / EKS                    Images published and application
                                      deployed

  Prometheus / Grafana                Backend metrics scraped and
                                      dashboard created

  k6                                  Smoke and staged `/health` load
                                      tests passed

  Kubernetes Metrics Server           Installed; node and pod metrics
                                      available

  Kubernetes HPA                      Scale-up from 1 to 3 and scale-down
                                      from 3 to 1 demonstrated

  Final report evidence               Add genuine screenshots and
                                      submission-specific details
  -----------------------------------------------------------------------

## 13. Possible future improvements

These are potential enhancements, **not claims of already implemented
features**: - Add CI stages for image scanning and automated ECR
publishing. - Add a controlled continuous deployment workflow to EKS. -
Add integration and load tests for movie search and watchlist
endpoints. - Add alert rules and notification routing in
Prometheus/Grafana. - Add ingress with TLS and a managed load balancer
for a production-facing deployment. - Add infrastructure lifecycle
automation and cost controls.

## Author

**Prince Verma**\
B.Tech --- Computer Science and Engineering\
Lovely Professional University

------------------------------------------------------------------------

```{=html}
<p align="center">
```
`<strong>`{=html}CineVault --- Discover. Organize. Observe.
Scale.`</strong>`{=html}
```{=html}
</p>
```
