const fs = require("fs");
const path = require("path");
const cors = require("cors");
const stream = require("stream");
const server = require("express");
const multer = require("multer");
const { google } = require("googleapis");

const uploadRouter = server();
uploadRouter.use( cors() );
uploadRouter.use( server.json({limit:"10gb"}) );
uploadRouter.use( server.urlencoded({extended:true,limit:"10gb"}) );
uploadRouter.use( server.static( path.join( __dirname, "./publish" ) ) );

const uploadFile = async ( fileObject ) => {
    const bufferStream = new stream.PassThrough();
    bufferStream.end( fileObject.buffer );
    const auth = new google.auth.GoogleAuth({
        keyFile: path.join(__dirname,'./google.json'),
        scopes: ['https://www.googleapis.com/auth/drive']
    })
    const fileName = `API_IMG_${ new Date().getTime() }.${ fileObject.mimetype?.split('/')[1] }`;
    const { data } = await google.drive({ version: 'v3', auth }).files.create({
        media: {
            mimeType: fileObject.mimetype,
            body: bufferStream
        },
        requestBody: {
            name: fileName,
            parents: ['1-sQEbClcbj6xmywa5XygM3wWfGCWWF69']
        },
        fields: 'id'
    });
    return data
};
uploadRouter.get('/', ( req, res ) => {
    req.body.dir = fs.readdirSync( __dirname );
    res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Kingslime API</title></head><body></body></html>`)
});
uploadRouter.post('/', multer().any(), async (req, res) => {
    const { files } = req;
    const result = [];
    for ( let f = 0; f < files.length; f++ ) {
        const file = await uploadFile( files[f] );
        result.push( file.id )
    }
    res.json({ result });
});
uploadRouter.listen( process.env.TOKEN || 5555 );

module.exports = uploadRouter;
