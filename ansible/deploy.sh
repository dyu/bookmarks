#!/bin/sh

CURRENT_DIR=$PWD
SCRIPT_DIR=$CURRENT_DIR
if [ ! -d $SCRIPT_DIR/deploy.yml ]; then
    
    SCRIPT=$(readlink -f "$0")
    # Absolute path this script is in
    SCRIPT_DIR=$(dirname "$SCRIPT")
fi

PROJECT_DIR=$(dirname "$SCRIPT_DIR")

[ ! -n "$REV_DATE" ] && REV_DATE=$(date)
REV=$(date -d "$REV_DATE" +%Y-%m-%d/%H_%M_%S)
REV_NAME=$(date -d "$REV_DATE" +%Y-%m-%d_%H-%M-%S)
REV_PREFIX=$(date -d "$REV_DATE" +%Y-%m-%d)
EXPIRE_HTTP_SESSION_TOKEN=$(date -d "$REV_DATE" +%d%H%M%S)

DEPLOY_TYPE=0
[ -n "$1" ] && DEPLOY_TYPE=$1

ansible-playbook -u deploy -i $SCRIPT_DIR/hosts.ini \
    -e project_dir=$PROJECT_DIR \
    -e deploy_rev=rev/$REV \
    -e deploy_rev_prefix=rev/$REV_PREFIX \
    -e deploy_rev_name=$REV_NAME \
    -e deploy_type=$DEPLOY_TYPE \
    $SCRIPT_DIR/deploy.yml
