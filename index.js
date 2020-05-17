'use strict'

const express = require('express');
const app = express();
const bodyParser = require('body-parser')
app.use(bodyParser.json())
const superagent = require('superagent')



async function breakItDown({ string = '', remaining} , {q, results, speed  }) {
    speed.dataPoints += 1
    if (speed.dataPoints % 1000 == 0) { console.log(`${speed.dataPoints} requests sent over ${Date.now() - speed.startTime}`); console.log(`Rate of requests is ${speed.dataPoints / (Date.now() - speed.startTime)}`) }
    return superagent.post('localhost:8080/permutate')
        .send({ string: string, remaining: remaining })
        .set('Accept', 'application/json')
        .then(res => {
            res.body.remaining.forEach(set => {
                if (set.remaining.length) {
                    q.push(set)
                    return
                }
                else if (set.remaining.length == 0) {
                    results.push(set.string)
                    return
                }
            })
        })
        .catch(e => {
            breakItDown(string, remaining)
            return
        });
}


app.post('/permutationOrchestration', async (req, res) => {
    let q = []
    let results = []
    let speed = {
        dataPoints: 0,
        startTime: Date.now()
    }
    let word = req.body.word
    let splitWord = word.split('')
    q.push({ string: '', remaining: splitWord })
    while (q.length) {
        let first10k = []
        for (let i = 0; (i < 1000 && i < q.length); i++) {
            first10k.push(q.pop())
        }
        let promiseArr = first10k.map(item => breakItDown(item, {q, results, speed}))
        await Promise.all(promiseArr)
    }
    console.log(`sending response for ${word} with ${results.length} results`)
    res.status(200).send(results)
})
 
app.listen(3001, () => console.log('orchestrator node listening on port 3001!'));
