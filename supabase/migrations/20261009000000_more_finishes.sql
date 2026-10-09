-- Seven more finishes, bringing the catalogue to ten. Each id matches an entry
-- in src/lib/templates; a render can only be saved with a finish listed here.

insert into public.templates (id, name, category, scale) values
  ('midnight-flake', 'Midnight Flake', 'flake', 3),
  ('saddle-flake', 'Saddle Flake', 'flake', 3),
  ('copper-metallic', 'Copper Metallic', 'metallic', 1.5),
  ('ocean-metallic', 'Ocean Metallic', 'metallic', 1.5),
  ('slate-quartz', 'Slate Quartz', 'quartz', 4),
  ('dove-solid', 'Dove Grey', 'solid', 1.5),
  ('graphite-solid', 'Graphite', 'solid', 1.5)
on conflict (id) do nothing;
