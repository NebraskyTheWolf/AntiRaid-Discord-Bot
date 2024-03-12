FROM wyzengroup/node18-yarn-gulp
USER root

RUN mkdir /workspace

COPY package.json yarn.lock /workspace/
RUN <<EOF
   cd /workspace
   yarn install --pure-lockfile
   npm install discord.js
   npm install @types/mongoose
   npm install mongoose
   npm install discord-modals
   npm install pug
   npm uninstall tsc
   npm install -D typescript
   mkdir logs
EOF

COPY . /workspace

CMD ["yarn", "run", "start"]
