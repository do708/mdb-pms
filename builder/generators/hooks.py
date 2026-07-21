from generators.base.template_generator import TemplateGenerator


class HooksGenerator(TemplateGenerator):

    def generate(self):

        hooks = [

            "customers",
            "projects",
            "workorders",
            "documents",
            "users",

        ]

        for hook in hooks:

            self.render(
                "hooks/hook.ts.j2",
                self.root.parent
                / "app"
                / "src"
                / "hooks"
                / f"use-{hook}.ts",
                hook=hook
            )

            print(
                f"✓ hooks/use-{hook}.ts"
            )