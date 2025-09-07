#!/bin/bash

# Script to handle mobile builds by temporarily moving API routes and problematic dynamic routes

if [ "$1" = "pre" ]; then
    echo "Preparing for mobile build - moving API routes and dynamic routes..."
    if [ -d "app/api" ]; then
        mv app/api /tmp/api_backup_printmate
        echo "API routes moved to backup"
    fi
    if [ -d "app/printers" ]; then
        mv app/printers /tmp/printers_backup_printmate
        echo "Dynamic printer routes moved to backup"
    fi
elif [ "$1" = "post" ]; then
    echo "Restoring API routes and dynamic routes after mobile build..."
    if [ -d "/tmp/api_backup_printmate" ]; then
        mv /tmp/api_backup_printmate app/api
        echo "API routes restored"
    fi
    if [ -d "/tmp/printers_backup_printmate" ]; then
        mv /tmp/printers_backup_printmate app/printers
        echo "Dynamic printer routes restored"
    fi
else
    echo "Usage: $0 [pre|post]"
    exit 1
fi