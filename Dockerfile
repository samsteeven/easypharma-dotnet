# Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY EasyPharma.slnx* EasyPharma.sln* ./
COPY src/EasyPharma.Api/EasyPharma.Api.csproj src/EasyPharma.Api/
RUN dotnet restore src/EasyPharma.Api/EasyPharma.Api.csproj
COPY src/EasyPharma.Api src/EasyPharma.Api
RUN dotnet publish src/EasyPharma.Api/EasyPharma.Api.csproj -c Release -o /app --no-restore

# Runtime : image ASP.NET, exécution sous l'utilisateur non root "app"
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app .
USER $APP_UID
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "EasyPharma.Api.dll"]
