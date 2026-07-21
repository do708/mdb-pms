#!/usr/bin/env python3

import argparse
from pathlib import Path

from generators.structure import StructureGenerator
from generators.config import ConfigGenerator
from generators.prisma import PrismaGenerator
from generators.nextjs import NextGenerator
from generators.auth import AuthGenerator
from generators.dashboard import DashboardGenerator
from generators.projects import ProjectsGenerator
from generators.customers import CustomersGenerator
from generators.planning import PlanningGenerator
from generators.workorders import WorkordersGenerator
from generators.materials import MaterialsGenerator
from generators.documents import DocumentsGenerator
from generators.reports import ReportsGenerator
from generators.users import UsersGenerator
from generators.settings import SettingsGenerator
from generators.api import ApiGenerator
from generators.services import ServicesGenerator
from generators.repositories import RepositoriesGenerator
from generators.database import DatabaseGenerator
from generators.env import EnvGenerator
from generators.navigation import NavigationGenerator
from generators.components import ComponentsGenerator
from generators.forms import FormsGenerator
from generators.features import FeaturesGenerator
from generators.validation import ValidationGenerator
from generators.types import TypesGenerator
from generators.hooks import HooksGenerator
from generators.constants import ConstantsGenerator
from generators.utils import UtilsGenerator
from generators.emails import EmailsGenerator
from generators.pdf import PdfGenerator





class Builder:

    def __init__(self):
        self.root = Path(__file__).resolve().parent


def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "command"
    )

    args = parser.parse_args()

    builder = Builder()

    if args.command == "init":

        StructureGenerator(
            builder.root
        ).generate()


    elif args.command == "generate":

        ConfigGenerator(
            builder.root
        ).generate()

        PrismaGenerator(
            builder.root
        ).generate()

        NextGenerator(
        builder.root
    ).generate()

        AuthGenerator(
            builder.root
        ).generate()

        DashboardGenerator(
        builder.root
    ).generate()
        
        ProjectsGenerator(
        builder.root
    ).generate()

        CustomersGenerator(
        builder.root
    ).generate()
        
        PlanningGenerator(
        builder.root
    ).generate()

        WorkordersGenerator(
        builder.root
    ).generate()

        MaterialsGenerator(
        builder.root            
    ).generate()

        DocumentsGenerator(
        builder.root            
    ).generate()

        ReportsGenerator(   
        builder.root
    ).generate()
        
        UsersGenerator(
        builder.root
    ).generate()
        
        SettingsGenerator(
        builder.root
    ).generate()
        
        ApiGenerator(
        builder.root
    ).generate()
        
        ServicesGenerator(
        builder.root
    ).generate()
        
        RepositoriesGenerator(
        builder.root
    ).generate()

        DatabaseGenerator(
        builder.root
    ).generate()

        EnvGenerator(
        builder.root
    ).generate()

        NavigationGenerator(
        builder.root
    ).generate()
        
        ComponentsGenerator(
        builder.root
    ).generate()
        FormsGenerator(
        builder.root
    ).generate()
        
        FeaturesGenerator(
        builder.root
    ).generate()

        ValidationGenerator(
        builder.root
    ).generate()

        TypesGenerator(
        builder.root
    ).generate()

        HooksGenerator(
        builder.root
    ).generate()

        ConstantsGenerator(
        builder.root        
    ).generate()
        
        UtilsGenerator(
        builder.root
    ).generate()
        
        EmailsGenerator(
        builder.root
    ).generate()


        PdfGenerator(
        builder.root
    ).generate()




if __name__ == "__main__":
    main()