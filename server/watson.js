var watson = require('watson-developer-cloud');
var fs = require('fs');
var path = require('path');

var speech_to_text = watson.speech_to_text({
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  version: 'v1',
  url: 'https://stream.watsonplatform.net/speech-to-text/api',
});

exports.watsonSpeechToText = function (audioFile, ws) {

  return new Promise(function (resolve, reject) {

    var params = {
      content_type: 'audio/flac',
      timestamps: true,
      continuous: true,
      confidence: false
    };

    var results = [];

    // create the stream
    var recognizeStream = speech_to_text.createRecognizeStream(params);

    // pipe in some audio
    fs.createReadStream(audioFile).pipe(recognizeStream);

    // listen for 'data' events for just the final text
    // listen for 'results' events to get the raw JSON with interim results, timings, etc.

    recognizeStream.setEncoding('utf8'); // to get strings instead of Buffers from `data` events

    recognizeStream.on('results', function (e) {
      if (e.results[0].final) {
        // console.log(e.results[0].alternatives[0]);
        //ws.send(JSON.stringify(e.results[0].alternatives[0]))
        ws.emit('payload', e.results[0].alternatives[0])
        results.push(e);
      }
    });


    // var sendData = _.memoize(function (e) {
    //   if (e.results[0].final) {
    //     // console.log(e.results[0].alternatives[0]);
    //     //ws.send(JSON.stringify(e.results[0].alternatives[0]))
    //     ws.emit('payload', e.results[0].alternatives[0])
    //     results.push(e);
    //   }
    // }, (e) => {
    //   console.log(e.results[0].alternatives[0].transcript.replace(/ /gi, ''));
    //   return e.results[0].alternatives[0].transcript.replace(/ /gi, '');
    // });


    // recognizeStream.on('results', sendData);

    recognizeStream.on('error', function (err) {
      util.handleError('Error writing to transcript.json: ' + err);
    });

    recognizeStream.on('close', function () {
      ws.emit('finished');
    });
  });
};
