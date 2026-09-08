import { Course } from '../../types';
import { CourseCard } from './CourseCard';

interface CourseGridProps {
  courses: Course[];
}

export const CourseGrid = ({ courses }: CourseGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {courses.map((course) => (
        <CourseCard key={course._id} course={course} />
      ))}
    </div>
  );
};
