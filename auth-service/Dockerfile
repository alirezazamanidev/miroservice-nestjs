FROM node:20-alpine
WORKDIR /usr/src/app
COPY ./package*.json ./
RUN npm install 
RUN npm i @nestjs/cli@11.0.7
COPY . .
RUN npm run build

CMD [ "npm","run","start:prod" ]