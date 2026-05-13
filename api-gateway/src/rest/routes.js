const express = require('express');
const router = express.Router();
const { patientClient, rdvClient, pharmacieClient } = require('../grpc/clients');

router.get('/patients', (req, res) => {
  patientClient.listPatients({}, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response.patients);
  });
});

router.post('/patients', (req, res) => {
  patientClient.createPatient(req.body, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
});

router.get('/patients/:id', (req, res) => {
  patientClient.getPatient({ id: req.params.id }, (err, response) => {
    if (err) return res.status(404).json({ error: err.message });
    res.json(response);
  });
});

router.delete('/patients/:id', (req, res) => {
  patientClient.deletePatient({ id: req.params.id }, (err, response) => {
    if (err) return res.status(404).json({ error: err.message });
    res.json({ message: 'Patient supprimé avec succès' });
  });
});

router.post('/rendezvous', (req, res) => {
  rdvClient.createRendezVous(req.body, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
});

router.get('/rendezvous/:id', (req, res) => {
  rdvClient.getRendezVous({ id: req.params.id }, (err, response) => {
    if (err) return res.status(404).json({ error: err.message });
    res.json(response);
  });
});

router.put('/rendezvous/:id/statut', (req, res) => {
  rdvClient.updateStatut({ id: req.params.id, statut: req.body.statut }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
});

router.delete('/rendezvous/:id', (req, res) => {
  rdvClient.deleteRendezVous({ id: req.params.id }, (err, response) => {
    if (err) return res.status(404).json({ error: err.message });
    res.json({ message: 'Rendez-vous supprimé avec succès' });
  });
});

router.post('/ordonnances', (req, res) => {
  pharmacieClient.createOrdonnance(req.body, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
});

router.get('/ordonnances/:id', (req, res) => {
  pharmacieClient.getOrdonnance({ id: req.params.id }, (err, response) => {
    if (err) return res.status(404).json({ error: err.message });
    res.json(response);
  });
});

router.put('/ordonnances/:id/delivrer', (req, res) => {
  pharmacieClient.delivrerOrdonnance({ id: req.params.id }, (err, response) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(response);
  });
});

module.exports = router;