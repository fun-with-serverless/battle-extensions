FROM mcr.microsoft.com/devcontainers/typescript-node:20-bookworm
RUN sudo apt-get update
RUN echo 'bind '\''"\e[A": history-search-backward'\' >> /etc/bash.bashrc
RUN echo 'bind '\''"\e[B": history-search-forward'\' >> /etc/bash.bashrc
RUN echo 'alias ll="ls -l"' >> /etc/bash.bashrc
