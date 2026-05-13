const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'ms-rendezvous',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const sendEvent = async (topic, message) => {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }]
  });
  await producer.disconnect();
  console.log(` Événement envoyé sur le topic: ${topic}`);
};

module.exports = { sendEvent };