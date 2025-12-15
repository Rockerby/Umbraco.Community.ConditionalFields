@ECHO OFF
:: This file can now be deleted!
:: It was used when setting up the package solution (using https://github.com/LottePitcher/opinionated-package-starter)

:: set up git
git init
git branch -M main
git remote add origin https://github.com/Rockerby/Umbraco.Community.ConditionalProperties.git

:: ensure latest Umbraco templates used
dotnet new install Umbraco.Templates --force

:: use the umbraco-extension dotnet template to add the package project
cd src
dotnet new umbraco-extension -n "ConditionalProperties" --site-domain "https://localhost:44367" --include-example

:: replace package .csproj with the one from the template so has nuget info
cd ConditionalProperties
del ConditionalProperties.csproj
ren ConditionalProperties_nuget.csproj ConditionalProperties.csproj

:: add project to solution
cd..
dotnet sln add "ConditionalProperties"

:: add reference to project from test site
dotnet add "ConditionalProperties.TestSite/ConditionalProperties.TestSite.csproj" reference "ConditionalProperties/ConditionalProperties.csproj"
