from pathlib import Path
from shutil import copytree, rmtree, copyfileobj
from subprocess import check_output, Popen, PIPE, STDOUT, CalledProcessError
import os
import gzip

Import("env")

def gzipFile(file):
    with open(file, 'rb') as f_in:
        with gzip.open(file + '.gz', 'wb') as f_out:
            copyfileobj(f_in, f_out)
    os.remove(file)

def flagExists(flag):
    buildFlags = env.ParseFlags(env["BUILD_FLAGS"])
    for define in buildFlags.get("CPPDEFINES"):
        if (define == flag or (isinstance(define, list) and define[0] == flag)):
            return True

import subprocess

def buildWeb():
    os.chdir("interface")
    print("Building interface with npm")
    try:
        subprocess.run("npm install", shell=True, check=True)
        subprocess.run("npm run build", shell=True, check=True, stdout=subprocess.DEVNULL)
        buildPath = Path("build")
        wwwPath = Path("../data/www")
        if wwwPath.exists() and wwwPath.is_dir():
            rmtree(wwwPath)        
        if not flagExists("PROGMEM_WWW"):
            print("Copying interface to data directory")
            copytree(buildPath, wwwPath)
            for currentpath, folders, files in os.walk(wwwPath):
                for file in files:
                    gzipFile(os.path.join(currentpath, file))
    finally:
        os.chdir("..")

if (os.environ.get("REACT_SKIP_UI") != "1") and (len(BUILD_TARGETS) == 0 or "upload" in BUILD_TARGETS):
    buildWeb()
else:
    print("Skipping build interface step for target(s): " + ", ".join(BUILD_TARGETS))
