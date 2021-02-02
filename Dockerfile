FROM node:alpine

ARG TOKEN
ARG MONGO_URL

ENV TOKEN=$TOKEN
ENV MONGO_URL=$MONGO_URL

# Create app directory
WORKDIR /usr/src/app

# Bundle app source
COPY . .

EXPOSE 443 443

CMD [ "npm", "start" ]
