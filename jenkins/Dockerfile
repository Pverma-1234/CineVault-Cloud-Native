
FROM jenkins/jenkins:lts-jdk21

USER root

# Install required system tools and Node.js
RUN apt-get update && \
    apt-get install -y docker.io awscli curl git wget gnupg nodejs npm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Trivy
RUN wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key \
    | gpg --dearmor \
    -o /usr/share/keyrings/trivy.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main" \
    > /etc/apt/sources.list.d/trivy.list && \
    apt-get update && \
    apt-get install -y trivy && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

USER jenkins
