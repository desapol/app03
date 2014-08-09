var express = require('express'),
	swig = require('swig');

var RedisStore = require('connect-redis')(express);
var server = express();
var fs = require('fs');
var exec = require('exec');


//Configuracion para renderear vistas
server.engine('html', swig.renderFile);
server.set('view engine', 'html');
server.set('views', './views');

// Agregamos post, cookies and sessions
server.configure(function() {
	server.use(express.logger());
	server.use(express.cookieParser());
	server.use(express.bodyParser());

	server.use(express.session({
		secret : "lolcatz",
		store  : new RedisStore({})
	}));

});

// Middlewares
var isntLoggedIn = function (req, res, next) {	
	if(!req.session.user){
		res.redirect('/');
		return;
	}

	next();
};

var isLoggedIn = function (req, res, next) {
	if(req.session.user){
		res.redirect('/app');
		return;
	}

	next();
};

server.get('/', isLoggedIn, function (req, res) {
	res.render('home');
});

server.get('/app', isntLoggedIn, function (req, res) {
	res.render('app', {user : req.session.user});
});

server.get('/monitor', function (req, res) {
	res.render('monitor', {
		axo : req.session.axo,
		nombre : req.session.nombre,
		apepat : req.session.apepat,
		codigo : req.session.codigo,
		sede : req.session.sede,
		area : req.session.area
	});
});

server.get('/log-out', function (req, res) {
	req.session.destroy();
	res.redirect('/');
});
server.post('/log-in', function (req, res){
	var username = req.body.username;
	var password = req.body.password;

	if(username == 'vhuaman' && password == '4n3x0$'){
		req.session.regenerate(function(){
			req.session.user = username;
			res.redirect('/app');
		});
	}else{
		res.redirect('/');
	}	
});

server.post('/crear-anexo', function (req, res){
	req.session.axo = req.body.anexo;
	req.session.nombre = req.body.name;
	req.session.apepat	 = req.body.apepat;
	req.session.codigo = req.body.cod;
	req.session.sede = req.body.sede;
	req.session.area = req.body.area;


//Agregar anexo en archivos de configuracion Asterisk.
	fs.appendFile('/etc/asterisk/sip_sede_'+req.session.sede+'.conf','['+ req.session.axo +']'+'(pla_anexos)'+'\r\n'+'accountcode='+req.session.axo+'\r\n'+'secret='+req.session.axo+'\r\n'+'mailbox='+req.session.axo+'@default'+'\r\n'+'callerid='+req.session.nombre+'.'+req.session.apepat+'.'+req.session.codigo+'-'+req.session.area+'-Sede'+req.session.sede+'<'+req.session.axo+'>'+'\r\n' , function(err) {
		if (err) throw err;	
	});
	exec('asterisk -rx "sip reload"', function(err, out, code) {
        if (err instanceof Error)
                throw err;
                process.stderr.write(err);
                process.stdout.write(out);
                
        });
	res.redirect('/monitor');
});

server.listen(3000);