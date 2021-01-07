// Experiement using TensorFlow & COCO-SSD

const app = document.getElementById('app');
const loader = document.getElementById('loader');
const canvas = document.getElementById('canvas');
const video = document.getElementById('video');
const ctx = canvas.getContext('2d');

let modelPromise;
let model;
let predictions;
let maxDistance = 50;

window.onload = async () => {
  modelPromise = cocoSsd.load({ base: 'mobilenet_v2' });
  model = await modelPromise;

  video.addEventListener('play', () => requestAnimationFrame(updateCanvas), false);

  ctx.font = '14px Arial';
  ctx.fillStyle = 'lightgrey';
  const title = 'Real-time social distancing detection 😷';
  const textSize = ctx.measureText(title).width;
  ctx.fillText(
  title,
  canvas.width / 2 - textSize / 2,
  canvas.height / 2);


  loader.style.display = 'none';
  app.style.display = 'block';
};

const drawBbox = () => {
  predictions.map(prediction => {
    if (prediction.class === 'person') {
      setDistance(prediction);
      const { distanceBreach, bbox: [x, y, width, height] } = prediction;

      if (distanceBreach) {
        const { distanceBreachLinks } = prediction;
        for (let i = 0; i < distanceBreachLinks.length; i++) {
          const [x, y, x2, y2] = distanceBreachLinks[i];
          ctx.strokeStyle = 'rgb(250, 0, 0)';
          ctx.fillStyle = 'rgb(250, 0, 0)';
          ctx.lineWidth = 1;
          ctx.fillRect(x - 2, y - 2, 4, 4);
          ctx.fillRect(x2 - 2, y2 - 2, 4, 4);
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgb(0, 250, 0)';
      ctx.fillStyle = 'rgb(0, 250, 0)';
      ctx.strokeRect(x, y, width, height);
      ctx.font = '9px Arial';
      ctx.fillText('Person', x, y - 2);
    }
  });
};

const setDistance = person => {
  const [x, y, w, h] = person.bbox;
  let tmpBreachDistances = [];

  for (let i = 0; i < predictions.length - 1; i++) {
    const { bbox } = predictions[i];
    const [x2, y2, w2, h2] = bbox;
    const a = x + w / 2 - (x2 + w2 / 2);
    const b = y + h / 2 - (y2 + h2 / 2);
    const distance = Math.sqrt(a * a + b * b);

    if (distance !== 0 && distance < maxDistance) {
      person.distanceBreach = true;
      tmpBreachDistances.push([
      x + w / 2,
      y + h / 2,
      x2 + w2 / 2,
      y2 + h2 / 2]);

    }
  }

  person.distanceBreachLinks = tmpBreachDistances;
};

const updateCanvas = async () => {
  const { ended, paused, width, height } = video;
  if (ended || paused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  predictions = await model.detect(imageData);
  drawBbox();

  requestAnimationFrame(updateCanvas);
};