'use strict'
const io = require('socket.io').listen(3004);
const ss = require('socket.io-stream');
const fs = require('fs');
const mkdirp = require('mkdirp');
const compressing = require('compressing');
let file,dir;

// 删除文件夹
const deleteDir = path => {
  let files = [],
    curPath
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path)
    files.forEach(function(file, index) {
      curPath = path + '/' + file
      if (fs.statSync(curPath).isDirectory()) {
        deleteDir(curPath)
      } else {
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(path)
  }
};

io.of('/public').on('connection', function(socket) {
  console.log('client connected')
  
  socket.emit('upload_a_file')
  
  socket.on('send_file_info', function (info) {
    let fileName = info.fileName;
    dir = __dirname + info.dir;

    if (!fs.existsSync(dir)) {
      mkdirp(dir, function(err) {
        if (err) console.error(err)
      })
    }

    file = `./public/${fileName}`;
    
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
    }
    
    dir = file.substr(0, file.length - 4);
    deleteDir(dir);

    ss(socket).on('uploading', function(stream) {
      stream.pipe(fs.createWriteStream(file))
    
      stream.on('end', function() {
        // 解决部分场景下文件关闭异常
      })
    })
  })

  socket.on('disconnect', function () {
    compressing.zip
      .uncompress(file, dir)
      .then(() => {
        fs.unlinkSync(file)
        console.log('success')
      })
    console.log(socket.id + ' has disconnected.')
  })
})

console.log('Socket.io server started at port 3004')
