 const express = require('express');
 const bodyParser = require('body-parser');
 const path = require('path');
 const mongoose = require("mongoose");
 const crypto = require("crypto");
 const multer = require('multer');
 const GridFsStorage = require('multer-gridfs-storage');
 const Grid = require('gridfs-stream');
 const methodOverride = require('method-override');


 const app = express();

 //middleware
 app.use(bodyParser.json());
 app.use(methodOverride('_method'));

 app.set('view engine','ejs');

 //momgo uri
 const mongoURI = "mongodb://localhost:27017/mongouploads";

 //Create mongo connection
 const conn = mongoose.createConnection(mongoURI,);
  //init gfs
  let gfs;
  conn.once('open', ()=> {
     gfs = Grid(conn.db, mongoose.mongo);
     gfs.collection('uploads');
   
    // all set!
  })

  //create storage engine
  const storage = new GridFsStorage({
    url: "mongodb://localhost:27017/mongouploads",
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });


 app.get('/',(req,res) =>{
    gfs.files.find().toArray((err,files) => {
        //check if files
        if(!files ||files.length === 0) {
           res.render('index', {files: false});
        } else {
            files.map(file => {
                if(file.contentType ==='image/jpeg' || file.contentType === 'image/png' || file.contentType ==='video/mp4') {
                   file.isImage = true;
                   file.isVideo = true;
                }else {
                    file.isImage = false;
                    file.isVideo= false;
                }
            });
             res.render('index', {files: files});
        }
     
    });

 });

 app.post('/upload', upload.single('file'),(req,res) => {
  //res.json({file:req.file});
  res.redirect('/');

 });


 //@route get /files
 app.get('/files', (req,res) => {
     gfs.files.find().toArray((err,files) => {
         //check if files
         if(!files ||files.length === 0){
             return res.status(404).json({
                 err: 'No files exist'
             });
         }
        
        //files exist
        return res.json(files);
     });

 });

  //@route get /files/:filename
  //desc to display file
  app.get('/files/:filename', (req,res) => {
    gfs.files.findOne({filename:req.params.filename}, (err,file) =>{

        if(!file ||file.length === 0){
            return res.status(404).json({
                err: 'No file exist'
            });
        }

// file exist
   return res.json(file);

    });

});

  //@route get /image/:filename
  //desc display image
  app.get('/image/:filename', (req,res) => {
    gfs.files.findOne({filename:req.params.filename}, (err,file) =>{

        if(!file ||file.length === 0){
            return res.status(404).json({
                err: 'No file exist'
            });
        }
     //check if image
     if(file.contentType ==='image/jpeg' || file.contentType === 'img/png'){
        //read output to browser
         const readstream = gfs.createReadStream(file.filename);
         readstream.pipe(res);

     }else {
         res.status(404).json({
             err: 'not an image'
         });
     }

    });

});



//@video route

app.get('/video/:filename', (req,res) => {
    gfs.files.findOne({filename:req.params.filename}, (err,file) =>{

        if(!file ||file.length === 0){
            return res.status(404).json({
                err: 'No file exist'
            });
        }
     //check if video
     if(file.contentType ==='video/mp4'){
        //read output to browser
         const readstream = gfs.createReadStream(file.filename);
         readstream.pipe(res);

     }else {
         res.status(404).json({
             err: 'not an video'
         });
     }

    });

});

//@route delete/files/:id
app.delete('/files/:id', (req,res) => {
    gfs.remove({_id: req.params.id,root:'uploads'}, (err,gridStore) => {
        if(err) {
           return res.status(404).json({ err: err});

        }

        res.redirect('/');

    });

});

 const port =5000;
 app.listen(port, () => {
    console.log(`app is running at ${port}`);
  });
  