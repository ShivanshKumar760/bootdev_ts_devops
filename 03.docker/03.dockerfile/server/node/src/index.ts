import http, { IncomingMessage, ServerResponse } from "http";
const PORT = 8010;

function handlePage(req:IncomingMessage,res:ServerResponse):void{
    res.writeHead(200,{"Content-Type":"text/html"});
    const page = `<html>
<head></head>
<body>
	<p> Hello from Docker! I'm a Go server. </p>
</body>
</html>
`;

res.end(page);
}

const server = http.createServer((req,res)=>{
    if(req.url ==="/"){
        handlePage(req,res);
        return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
})

server.listen(PORT, () => {
  console.log(`server started on ${PORT}`);
});