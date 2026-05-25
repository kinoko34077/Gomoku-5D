cmd /c npx.cmd tsc -b --pretty false
cmd /c node_modules\.bin\vitest.cmd run
cmd /c npm.cmd run build
cmd /c npm.cmd run preview -- --host 127.0.0.1 --port 4175