FROM node:22-alpine
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm ci --prefix frontend
COPY frontend ./frontend
ARG VITE_EMAILJS_SERVICE_ID
ARG VITE_EMAILJS_TEMPLATE_ID
ARG VITE_EMAILJS_PUBLIC_KEY
ARG VITE_EMAILJS_OTP_TEMPLATE_ID
ENV VITE_EMAILJS_SERVICE_ID=$VITE_EMAILJS_SERVICE_ID
ENV VITE_EMAILJS_TEMPLATE_ID=$VITE_EMAILJS_TEMPLATE_ID
ENV VITE_EMAILJS_PUBLIC_KEY=$VITE_EMAILJS_PUBLIC_KEY
ENV VITE_EMAILJS_OTP_TEMPLATE_ID=$VITE_EMAILJS_OTP_TEMPLATE_ID
RUN npm run build --prefix frontend

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --omit=dev --prefix backend
COPY backend ./backend

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
WORKDIR /app/backend
CMD ["node", "src/index.js"]
