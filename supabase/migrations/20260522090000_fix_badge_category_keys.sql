update public.badge_categories
set key = case key
  when 'first' then 'first-place'
  when 'second' then 'second-place'
  when 'third' then 'third-place'
  when 'fourth' then 'fourth-place'
  else key
end
where key in ('first', 'second', 'third', 'fourth');
