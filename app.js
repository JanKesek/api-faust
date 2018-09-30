var express = require('express'), path = require('path'), bodyParser = require('body-parser')
, cons = require('consolidate'), dust = require('dustjs-helpers'), pg = require('pg'),
 app = express(), assert = require('assert'), createError = require('http-errors'), async = require('async');


const config = {
	user: 'jkes',
    database: 'airport',
    password: 'root',
    port: 5432

}
const pool = new pg.Pool(config);


//app.engine('dust', cons.dust);

//app.set('view engine', 'dust');
//app.set('views', __dirname + '/views');

//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/tourists', (req, res, next) => {
   pool.connect(function (err, client, done) {
       if (err) {
           console.log("Cannot connect to the DB" + err);
       }
       client.query('SELECT * FROM tourists', function (err, result) {
            done();
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            res.status(200).send(result.rows);
       })
   })
});


/*
const mydeletefn = table => (req, res, next) => {
   pool.connect(function (err, client, done) {
       if (err) {
           console.log("Cannot connect to the DB" + err);
       }
       client.query('DELETE FROM ' + {table}+' WHERE '+ ({table}.id=req.params.id), (err, result) => {
            done();
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            client.query('SELECT * FROM ' + {table}, (err, result) => {
                done();
                res.status(200).send(result.rows)
            });
       })
   })
};
app.delete('/tourists/:id', mydeletefn('tourists'));
app.delete('/flights/:id', mydeletefn('flights'));
*/

app.delete('/tourists/:id', (req, res, next) => {
   pool.connect(function (err, client, done) {
       if (err) {
           console.log("Cannot connect to the DB" + err);
       }
       client.query('DELETE FROM tourists WHERE tourists.id=' + req.params.id, function (err, result) {
            done();
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            client.query('SELECT * FROM tourists', function (err, result) {done();res.status(200).send(result.rows)});
       })
   })
});
app.delete('/flights/:id', (req, res, next) => {
   pool.connect(function (err, client, done) {
       if (err) {
           console.log("Cannot connect to the DB" + err);
       }
       client.query('DELETE FROM flights WHERE flights.id=' + req.params.id, function (err, result) {
            done();
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            client.query('SELECT * FROM flights', function (err, result) {done();res.status(200).send(result.rows)});
       })
   })
});



app.post('/tourists', async(req, res, err) => {

	let dbResult=[];
	for (let i=0;i<req.body.listofflightsbyid.length;i++) {
        try {
            let result = await callDB( "SELECT flights.id FROM flights WHERE flights.id = " + req.body.listofflightsbyid[i] );
            dbResult.push(result);
        }
        catch (err) {

            console.log("Flight with id " + req.body.listofflightsbyid[i] + " you want to add to list of flights does not exist");
            res.status(500);
            return res.send("Bad listofflightsbyid request, Flight with id " + req.body.listofflightsbyid[i] + " does not exist");

        }
    }

    console.log("Successfully fetched all records ", dbResult);
    res.status(200);
    return res.send(dbResult);
})

app.get('/flights', (req, res, next) => {
   pool.connect(function (err, client, done) {
       if (err) {
           console.log("Cannot connect to the DB" + err);
       }
       client.query('SELECT * FROM flights', function (err, result) {
            done();
            if (err) {
                console.log(err);
                res.status(400).send(err);
            }
            var touristResult = result.rows;
            console.log(result.rows);
            res.status(200).send(result.rows);
            

       })
   })
});




app.post('/flights', async (req, res) => {
    let listoftouristsbyid = req.body.listoftouristsbyid;
    let dbResult = [];
    for (let i = 0; i < listoftouristsbyid.length; i++) {

        try {
            let result = await callDB( "SELECT tourists.id FROM tourists WHERE tourists.id = " + listoftouristsbyid[i] );
            dbResult.push(result);
        }
        catch (err) {

            console.log("Tourist " + listoftouristsbyid[i] + " you want to add does not exist");

            res.status(500);
            return res.send("Bad listoftoutistbyid request, student with id " + i + " does not exist");

        }
    }

    console.log("Successfully fetched all records ", dbResult);

    res.status(200);
    return res.send(dbResult);

});

function callDB(query) {

    return new Promise ( (resolve, reject) => {
        client.query(query, function(err, result) {

            if (result.rows.length === 0) {
                reject("not found");
            } else {
                resolve(result.rows);
            }

        })
    });
}

app.listen(3000, function() {
	console.log('Server started on port:3000');

})
