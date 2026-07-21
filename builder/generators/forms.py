from generators.base.template_generator import TemplateGenerator


class FormsGenerator(TemplateGenerator):

    def generate(self):

        forms = [

            "CustomerForm",
            "ProjectForm",
            "WorkorderForm",
            "UserForm",

        ]


        for form in forms:

            self.render(
                "forms/form.tsx.j2",
                self.root.parent
                / "app"
                / "src"
                / "components"
                / "forms"
                / f"{form}.tsx",
                form=form
            )

            print(
                f"✓ components/forms/{form}.tsx"
            )