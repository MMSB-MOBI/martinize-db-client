cd ~/IBCP

if [ ! -d "/path/to/dir" ]
then
  # Create the NGL repo
  git clone https://github.com/alkihis/ngl.git
fi

cd ngl

# Refresh the project with the last version
git pull
npm i
git commit -am "Updated NGL"
npm run dts

# Copy the types to the NPM module
cp -R -f declarations ~/Prog/martinize-db-client/node_modules/@mmsb/ngl/
