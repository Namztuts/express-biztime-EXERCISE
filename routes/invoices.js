const express = require('express');
const ExpressError = require('../expressError');
const router = new express.Router();
const db = require('../db');

// get a list of all invoices
router.get('/', async (request, response, next) => {
   try {
      const results = await db.query('SELECT * FROM invoices');
      return response.json({ invoices: results.rows });
   } catch (error) {
      console.error('Database query error:', error);
      return next(error);
   }
});

// get single invoice based on [id]
router.get('/:id', async (request, response, next) => {
   try {
      const invoiceID = request.params.id; //the :code in the route is held in request.params
      const results = await db.query('SELECT * FROM invoices WHERE id = $1', [
         invoiceID,
      ]);
      // if there is not company with the code provided, throw this error
      if (results.rows.length === 0) {
         throw new ExpressError(
            `Can't find company with code of ${invoiceID}`,
            404
         );
      }
      return response.send({ invoice: results.rows[0] });
   } catch (error) {
      return next(error); //NOTE: getting two error 'messages' if i put an incorrect [code]
   }
});

// create a new invoice
router.post('/', async (request, response, next) => {
   try {
      const { comp_code, amt } = request.body;
      const results = await db.query(
         'INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *',
         [comp_code, amt]
      );
      return response.status(201).json({ invoice: results.rows[0] });
   } catch (error) {
      return next(error);
   }
});

// update an invoice based on [id]
router.put('/:id', async (request, response, next) => {
   try {
      const { amt } = request.body;
      const invoiceID = request.params.id;
      const results = await db.query(
         'UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *',
         [amt, invoiceID]
      );
      //NOTE: to cover more bases, would add logic in here so that we can update just name or just type instead of needing both (which is how it is now)
      if (results.rows.length === 0) {
         throw new ExpressError(
            `Can't update invoice with id of ${invoiceID}`,
            404
         );
      }
      return response.send({ invoice: results.rows[0] }); //NOTE: .send is like .json, but .json ensures that it is json
   } catch (error) {
      return next(error);
   }
});

// delete a company based on [id]
router.delete('/:id', async (request, response, next) => {
   try {
      const invoiceID = request.params.id;
      const results = await db.query('DELETE FROM invoices WHERE id = $1', [
         invoiceID,
      ]);
      // if rowCount is zero (which means there were no effected rows/deleted rows)
      if (results.rowCount === 0) {
         throw new ExpressError(
            `Can't find invoice with id of ${invoiceID}`,
            404
         );
      }
      return response.send({ status: 'deleted' });
   } catch (error) {
      return next(error);
   }
});

module.exports = router;
