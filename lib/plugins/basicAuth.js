// env var is specified like:
// 		BASIC_AUTH=a:b,c:d,e:f
// parse out into credential pairs:
// 		[ [ 'a', 'b' ], [ 'c', 'd' ], [ 'e', 'f' ] ]
if (!process.env.BASIC_AUTH) {
	throw new Error("missing BASIC_AUTH env var")
}
const CREDS = process.env.BASIC_AUTH.split(",").map((cred) =>  cred.split(":"));


module.exports = {
	requestReceived: (req, res, next) => {
		let auth = req.headers.authorization;
		if (!auth) return res.send(401);

		// malformed
		let parts = auth.split(' ');
		if ('basic' != parts[0].toLowerCase()) return res.send(401);
		if (!parts[1]) return res.send(401);
		auth = parts[1];

		// credentials
		auth = new Buffer(auth, 'base64').toString();
		auth = auth.match(/^([^:]+):(.+)$/);
		if (!auth) return res.send(401);

		let authenticated = CREDS.some((cred) =>  auth[1] === cred[0] && auth[2] === cred[1]);
		if (!authenticated) {
			return res.send(401);
		}

		req.prerender.authentication = {
			name: auth[1],
			password: auth[2]
		};

		return next();
	}
}