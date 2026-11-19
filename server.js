const express = require('express');
const app = express();

app.use(express.static('public'));
app.use('/dist',express.static('dist'));
app.use('/src',express.static('src'));


app.listen(8000, (e)=>{
    if (e){
        console.error(e);
    } else {
        console.log('Server running on http://localhost:8000/');
    }
});
