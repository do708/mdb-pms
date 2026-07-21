from generators.base.template_generator import TemplateGenerator


class NavigationGenerator(TemplateGenerator):

    def generate(self):

        self.render(
            "navigation/sidebar.tsx.j2",
            self.root.parent
            / "app"
            / "src"
            / "components"
            / "navigation"
            / "Sidebar.tsx"
        )

        print("✓ components/navigation/Sidebar.tsx")