FROM wyzengroup/node18-yarn-gulp
USER root

WORKDIR /workspace
COPY . /workspace

CMD ["yarn", "run", "start"]
