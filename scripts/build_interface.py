import os
import sys
import gzip
import subprocess
from pathlib import Path
from shutil import copytree, rmtree, copyfileobj

try:
    Import("env")
    RUNNING_IN_PIO = True
except (NameError, ImportError):
    RUNNING_IN_PIO = False
    env = None

def gzipFile(file):
    with open(file, 'rb') as f_in:
        with gzip.open(file + '.gz', 'wb') as f_out:
            copyfileobj(f_in, f_out)
    os.remove(file)

def flagExists(flag):
    if not RUNNING_IN_PIO or env is None:
        return False
    try:
        buildFlags = env.ParseFlags(env.get("BUILD_FLAGS", []))
        for define in buildFlags.get("CPPDEFINES", []):
            if define == flag or (isinstance(define, list) and define[0] == flag):
                return True
    except Exception:
        pass
    return False

def buildWeb():
    try:
        script_dir = Path(__file__).resolve().parent
        project_root = script_dir.parent
    except NameError:
        project_root = Path(".").resolve()
        script_dir = project_root / "scripts"

    interface_dir = project_root / "interface"
    build_path = interface_dir / "build"
    www_path = project_root / "data" / "www"

    print(f"--> Packaging interface from {build_path} to {www_path}...")
    if not build_path.exists():
        print(f"--> Building interface with npm in {interface_dir}...")
        original_cwd = os.getcwd()
        os.chdir(interface_dir)
        try:
            subprocess.run(["npm", "run", "build"], check=True, shell=True)
        finally:
            os.chdir(original_cwd)

    if www_path.exists() and www_path.is_dir():
        rmtree(www_path)
    
    if not flagExists("PROGMEM_WWW"):
        print("--> Copying interface build to data/www and compressing with Gzip...")
        copytree(build_path, www_path)
        for currentpath, folders, files in os.walk(www_path):
            for file in files:
                gzipFile(os.path.join(currentpath, file))
        print("--> Frontend assets compressed and ready in data/www.")

if RUNNING_IN_PIO:
    build_targets = BUILD_TARGETS
    skip_ui = os.environ.get("REACT_SKIP_UI") == "1"
    if not skip_ui and (len(build_targets) == 0 or "upload" in build_targets or "buildfs" in build_targets or "uploadfs" in build_targets):
        buildWeb()
    else:
        print("--> Skipping frontend compilation (REACT_SKIP_UI is active).")
else:
    buildWeb()
