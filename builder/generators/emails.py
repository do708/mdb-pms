from generators.base.template_generator import TemplateGenerator


class EmailsGenerator(TemplateGenerator):

    def generate(self):

        emails = [

            "workorder-created",
            "workorder-completed",
            "document-uploaded",
            "password-reset",
            "welcome",

        ]


        for email in emails:

            self.render(
                "emails/email.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "emails"
                / f"{email}.ts",
                email=email
            )

            print(
                f"✓ emails/{email}.ts"
            )