#!/usr/bin/env python3
"""
TellSomeone - Site Publisher
Builds complete static site using site.json config
"""

import os
import sys
import shutil
import subprocess
import yaml
import json
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
try:
    from jinja2 import Markup
except ImportError:
    from markupsafe import Markup
import argparse
from datetime import datetime
from dotenv import load_dotenv
import htmlmin
import rcssmin
import rjsmin
import re