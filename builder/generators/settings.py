from generators.base.template_generator import TemplateGenerator


class SettingsGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "settings/page.tsx.j2",
            self.root.parent
            / "app"
            / "src"
            / "app"
            / "settings"
            / "page.tsx",
            project=self.manifest["project"]
        )

        print("✓ settings/page.tsx")