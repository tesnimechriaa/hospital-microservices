const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'ms-pharmacie',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'pharmacie-group' });

const startConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'rdv.confirme', fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const rdv = JSON.parse(message.value.toString());
      console.log(`  Nouveau RDV confirmé reçu !`);
      console.log(`   Patient ID: ${rdv.patient_id}`);
      console.log(`   Médecin: ${rdv.medecin}`);
      console.log(`   → Préparation ordonnance automatique...`);
    }
  });
  console.log(' MS Pharmacie écoute le topic: rdv.confirme');
};

module.exports = { startConsumer };