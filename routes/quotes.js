const express = require('express');
const Quote = require('./../models/quote');
const router = express.Router();

router.get('/new', (req,res) => {
    res.render('quotes/quotes_new', { quote: new Quote() })
});

router.get('/edit/:id', async (req,res) => {
    const quote = await Quote.findById(req.params.id);
    res.render('quotes/quotes_edit', { quote: quote })
});

router.get('/:slug', async (req, res) => {
    const quote = await Quote.findOne({slug :req.params.slug});
    if (quote == null) {
        res.redirect('/');
    }
    res.render('quotes/quotes_show', { quote: quote });
});

router.post('/', async (req,res, next)=>{
    req.quote = new Quote();
    next()
}, saveQuoteAndRedirect('new'));

router.put('/:id', async (req, res, next) => {
    req.quote = await Quote.findById(req.params.id);
    next()
}, saveQuoteAndRedirect('edit'));

router.delete('/:id', async (req, res) => {
    await Quote.findByIdAndDelete(req.params.id);
    res.redirect('/quotes');
});

function saveQuoteAndRedirect(path) {
    return async (req, res) => {
        let quote = req.quote;
        
        quote.title= req.body.title;
        quote.quote = req.body.quote;
        quote.authorName = req.body.authorName
        quote.authorImageUrl = req.body.authorImageUrl        
        quote.published = req.body.published !== "on"? "no": req.body.published
        quote.metadataKeywords = req.body.metadataKeywords

        try {
            quote = await quote.save()
            res.redirect(`/quotes/${quote.slug}`)
        } catch (e) {
            res.render(`quotes/${path}`, {quote: quote});
        }
    }
}

module.exports = router;