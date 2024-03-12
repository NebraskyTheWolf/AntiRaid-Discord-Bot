FROM wyzengroup/node18-yarn-gulp
USER root

WORKDIR /workspace
COPY . /workspace

RUN <<EOF
   yarn install
   yarn remove tsc
   yarn add -D typescript
EOF

CMD ["yarn", "run", "start"]
