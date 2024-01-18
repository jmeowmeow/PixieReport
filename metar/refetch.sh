#!/bin/bash
ls -1 *.TXT | cut -d '.' -f1 | xargs -n 1 ./fetch
