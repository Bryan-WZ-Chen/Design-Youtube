FROM node:20-alpine

RUN  apk update & apk add ffmpeg

WORKDIR /design-youtube

COPY . ./

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]