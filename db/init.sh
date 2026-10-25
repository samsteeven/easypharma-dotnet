#!/bin/sh
# Crée la base easypharma_db et applique le schéma (identique à celui du backend Spring Boot) si elle est vide.
set -e
SQLCMD="/opt/mssql-tools18/bin/sqlcmd -C -I -b -S mssql -U sa -P $MSSQL_SA_PASSWORD"

$SQLCMD -Q "IF DB_ID('easypharma_db') IS NULL CREATE DATABASE easypharma_db"
tables=$($SQLCMD -d easypharma_db -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.tables" | tr -d '[:space:]')

if [ "$tables" = "0" ]; then
  echo "Base vide : application du schéma"
  $SQLCMD -d easypharma_db -i /db/V1__baseline_schema.sql
  $SQLCMD -d easypharma_db -i /db/V2__pharmacy_geography.sql
  if [ "${SEED_DEMO_DATA:-true}" = "true" ]; then
    $SQLCMD -d easypharma_db -f 65001 -i /db/seed.sql
  fi
else
  echo "Schéma déjà présent ($tables tables) : rien à faire"
fi
