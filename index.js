var express = require('express');
var path = require('path');
var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res, next) {
    res.sendFile(path.join(__dirname, './public', 'index.html'));
});
const port  = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));