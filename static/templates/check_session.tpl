<!DOCTYPE html>
<html lang="en">

<head>
    <title>Wellcome Musicoin Forum</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <link href='https://fonts.googleapis.com/css?family=Ubuntu:400,300' rel='stylesheet' type='text/css'>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
    <style>
        html,
        body {
            padding: 0;
            margin: 0;
            overflow: none;
            width: 100%;
            height: 100%;
        }

        body {
            background: url('https://i.imgur.com/UMnw0tW.jpg');
            font-family: 'Ubuntu', sans-serif;
            background-position: center center;
            background-size: cover;
            background-color: #FFDB58;
            color: #121212;
        }

        .loader {
            position: absolute;
            top: 50%;
            margin: -240px;
            left: 50%;
            width: 550px;
            height: 550px;
        }

        .loader h1 {
            position: absolute;
            top: 0px;
            left: 0px;
            text-align: center;
            width: 100%;
            top: 0px;
            line-height: 420px;
            font-size: 43px;
            color: rgba(0, 0, 0, 0.24);
            font-weight: 100;
        }
    </style>

</head>

<body>

    <div class="container">
        <div class="text-center">
            <h1>Wellcome to Musicoin Forum </h1>
            <h3>Wait a few seconds... You are already registered. </h3>
            <p>We are checking your session...</p>
        </div>
    </div>

    <div class="loader">
        <canvas width="550px" height="550px" id="loader"></canvas>
        <h1>Loading...</h1>
    </div>
    <script>
        $(function(){
            $.ajax({
                url: "/api/AuthFromBaseSite",
                type: "POST",
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                crossDomain: true,
                data: {
                },
                contentType: "application/json",
                cache: false,
                timeout: 15000,
                complete: function() {
                  console.log('process complete');
                },
                success: function(data) {
                    //window.location.href = data.redirectUrl;
                    console.log(data);
               },
                error: function(err) {
                  console.log('error'+err);                    
                 // window.location.href = '/';
                },
              });
        });

        Loadr = new(function Loadr(id) {
            // # Defines
            const max_size = 24;
            const max_particles = 1500;
            const min_vel = 20;
            const max_generation_per_frame = 10;

            // #Variables
            // sometimes i wrote code horrible enouhg to make eyes bleed 
            var canvas = document.getElementById(id);
            var ctx = canvas.getContext('2d');
            var height = canvas.height;
            var center_y = height / 2;
            var width = canvas.width;
            var center_x = width / 2;
            var animate = true;
            var particles = [];
            var last = Date.now(),
                now = 0;
            var died = 0,
                len = 0,
                dt;

            function isInsideHeart(x, y) {
                x = ((x - center_x) / (center_x)) * 3;
                y = ((y - center_y) / (center_y)) * -3;
                // Simplest Equation of lurve
                var x2 = x * x;
                var y2 = y * y;
                // Simplest Equation of lurve

                return (Math.pow((x2 + y2 - 1), 3) - (x2 * (y2 * y)) < 0);

            }

            function random(size, freq) {
                var val = 0;
                var iter = freq;

                do {
                    size /= iter;
                    iter += freq;
                    val += size * Math.random();
                } while (size >= 1);

                return val;
            }

            function Particle() {
                var x = center_x;
                var y = center_y;
                var size = ~~random(max_size, 2.4);
                var x_vel = ((max_size + min_vel) - size) / 2 - (Math.random() * ((max_size + min_vel) - size));
                var y_vel = ((max_size + min_vel) - size) / 2 - (Math.random() * ((max_size + min_vel) - size));
                var nx = x;
                var ny = y;
                var r, g, b, a = 0.05 * size;

                this.draw = function() {
                    r = ~~(255 * (x / width));
                    g = ~~(255 * (1 - (y / height)));
                    b = ~~(255 - r);
                    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.fill();
                }

                this.move = function(dt) {

                    nx += x_vel * dt;
                    ny += y_vel * dt;
                    if (!isInsideHeart(nx, ny)) {
                        if (!isInsideHeart(nx, y)) {
                            x_vel *= -1;
                            return;
                        }

                        if (!isInsideHeart(x, ny)) {
                            y_vel *= -1;
                            return;
                        }
                        // Lets do the crazy furbidden
                        x_vel = -1 * y_vel;
                        y_vel = -1 * x_vel;
                        return;
                    }

                    x = nx;
                    y = ny;
                }

            }

            function movementTick() {
                var len = particles.length;
                var dead = max_particles - len;
                for (var i = 0; i < dead && i < max_generation_per_frame; i++) {
                    particles.push(new Particle());
                }

                // Update the date
                now = Date.now();
                dt = last - now;
                dt /= 1000;
                last = now;
                particles.forEach(function(p) {
                    p.move(dt);
                });
            }

            function tick() {

                ctx.clearRect(0, 0, width, height);
                particles.forEach(function(p) {
                    p.draw();
                });

                requestAnimationFrame(tick);
            }

            this.start = function() {

            }

            this.done = function() {

            }

            setInterval(movementTick, 16);
            tick();

        })("loader");
    </script>
</body>
</html>